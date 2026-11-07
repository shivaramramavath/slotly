import { StandardAccessPolicy } from '../../../common/rbac/permissions.guard';

describe('RBAC Permission Registry & StandardAccessPolicy', () => {
  let policy: StandardAccessPolicy;

  beforeEach(() => {
    policy = new StandardAccessPolicy();
  });

  it('should grant SUPER_ADMIN all permissions unconditionally', async () => {
    const subject = { userId: 'root', role: 'SUPER_ADMIN' as const };
    const allowed = await policy.can(subject, 'TIMETABLE_PUBLISH');
    expect(allowed).toBe(true);
  });

  it('should enforce role boundaries according to RolePermissions registry', async () => {
    const student = { userId: 'stu-1', role: 'STUDENT' as const };
    const faculty = { userId: 'fac-1', role: 'FACULTY' as const };
    const designer = { userId: 'des-1', role: 'DESIGNER' as const };

    // Student cannot edit timetable
    expect(await policy.can(student, 'TIMETABLE_EDIT')).toBe(false);
    // Student can read timetable
    expect(await policy.can(student, 'TIMETABLE_READ')).toBe(true);

    // Faculty cannot edit blueprint
    expect(await policy.can(faculty, 'BLUEPRINT_EDIT')).toBe(false);

    // Designer can edit blueprint and timetable
    expect(await policy.can(designer, 'BLUEPRINT_EDIT')).toBe(true);
    expect(await policy.can(designer, 'TIMETABLE_EDIT')).toBe(true);
    // Designer cannot publish without Admin approval
    expect(await policy.can(designer, 'TIMETABLE_PUBLISH')).toBe(false);

    // Audit logs: only SUPER_ADMIN and ADMIN
    expect(await policy.can(designer, 'AUDIT_READ')).toBe(false);
    expect(await policy.can(faculty, 'AUDIT_READ')).toBe(false);
    expect(await policy.can(student, 'AUDIT_READ')).toBe(false);
    const admin = { userId: 'admin-1', role: 'ADMIN' as const };
    expect(await policy.can(admin, 'AUDIT_READ')).toBe(true);

    // Blueprint edit & structure manage
    expect(await policy.can(admin, 'BLUEPRINT_EDIT')).toBe(true);
    expect(await policy.can(admin, 'STRUCTURE_MANAGE')).toBe(true);
    expect(await policy.can(designer, 'STRUCTURE_MANAGE')).toBe(false);
    expect(await policy.can(faculty, 'STRUCTURE_MANAGE')).toBe(false);
    expect(await policy.can(student, 'STRUCTURE_MANAGE')).toBe(false);
  });

  it('should reject access across institutional boundaries', async () => {
    const adminInstA = {
      userId: 'admin-a',
      role: 'ADMIN' as const,
      institutionId: 'inst-A',
    };

    // Access resource belonging to inst-B should be denied
    const foreignResource = {
      type: 'project',
      institutionId: 'inst-B',
    };

    const allowed = await policy.can(
      adminInstA,
      'PROJECT_MANAGE',
      foreignResource,
    );
    expect(allowed).toBe(false);

    // Access resource within own institution should be allowed
    const ownResource = {
      type: 'project',
      institutionId: 'inst-A',
    };
    expect(await policy.can(adminInstA, 'PROJECT_MANAGE', ownResource)).toBe(
      true,
    );
  });
});
