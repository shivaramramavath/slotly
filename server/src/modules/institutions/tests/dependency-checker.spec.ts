import { BadRequestException } from '@nestjs/common';
import { DependencyCheckerService } from '../services/dependency-checker.service';

describe('DependencyCheckerService', () => {
  let service: DependencyCheckerService;

  beforeEach(() => {
    service = new DependencyCheckerService();
  });

  describe('assertParentActive (Creation Gate G1)', () => {
    it('should pass when parent exists and is active', () => {
      const parent = {
        id: 'dept-1',
        name: 'Computer Science',
        isDeleted: false,
      };
      expect(() =>
        service.assertParentActive(parent, 'Department', 'dept-1'),
      ).not.toThrow();
    });

    it('should throw PARENT_MISSING when parent is null', () => {
      expect(() =>
        service.assertParentActive(null, 'Department', 'dept-999'),
      ).toThrow(BadRequestException);

      try {
        service.assertParentActive(null, 'Department', 'dept-999');
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          code: string;
        };
        expect(response.code).toBe('PARENT_MISSING');
      }
    });

    it('should throw PARENT_MISSING when parent is soft-deleted', () => {
      const deletedParent = {
        id: 'dept-1',
        name: 'Computer Science',
        isDeleted: true,
      };
      expect(() =>
        service.assertParentActive(deletedParent, 'Department', 'dept-1'),
      ).toThrow(BadRequestException);

      try {
        service.assertParentActive(deletedParent, 'Department', 'dept-1');
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          code: string;
        };
        expect(response.code).toBe('PARENT_MISSING');
      }
    });
  });

  describe('assertNoActiveChildren (Delete with Impact G4)', () => {
    it('should pass when active children count is 0', () => {
      expect(() =>
        service.assertNoActiveChildren(0, 'Program', 'Computer Science'),
      ).not.toThrow();
    });

    it('should throw HAS_DEPENDENT_CHILDREN when active children count > 0', () => {
      expect(() =>
        service.assertNoActiveChildren(3, 'Program', 'Computer Science'),
      ).toThrow(BadRequestException);

      try {
        service.assertNoActiveChildren(3, 'Program', 'Computer Science');
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          code: string;
          message: string;
        };
        expect(response.code).toBe('HAS_DEPENDENT_CHILDREN');
        expect(response.message).toContain('3 active Program(s)');
      }
    });
  });

  describe('assertBatchCapacities (Capacity Validation)', () => {
    it('should pass when sum of batch sizes <= section strength', () => {
      const batches = [
        { name: 'Batch 1', size: 30 },
        { name: 'Batch 2', size: 30 },
      ];
      expect(() => service.assertBatchCapacities(batches, 60)).not.toThrow();
    });

    it('should throw CAPACITY_EXCEEDED when sum of batch sizes > section strength', () => {
      const batches = [
        { name: 'Batch 1', size: 40 },
        { name: 'Batch 2', size: 30 },
      ];
      expect(() => service.assertBatchCapacities(batches, 60)).toThrow(
        BadRequestException,
      );

      try {
        service.assertBatchCapacities(batches, 60);
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          code: string;
        };
        expect(response.code).toBe('CAPACITY_EXCEEDED');
      }
    });
  });
});
