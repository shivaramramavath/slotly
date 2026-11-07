// Unit tests for ExportMenu rendering, format options, and disabled state.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportMenu } from '@/features/library/components/export-menu';
import * as exportHook from '@/features/library/hooks/use-library-export';

describe('ExportMenu component', () => {
  it('renders disabled trigger when totalCount is 0', () => {
    render(<ExportMenu entity="faculty" totalCount={0} />);
    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute('disabled')).not.toBeNull();
  });

  it('renders enabled trigger when count > 0', () => {
    render(<ExportMenu entity="faculty" totalCount={12} />);
    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute('disabled')).toBeNull();
  });

  it('opens dropdown and displays Excel and CSV options on click', () => {
    render(<ExportMenu entity="subjects" totalCount={5} />);
    const trigger = screen.getByRole('button', { name: /export/i });

    fireEvent.click(trigger);

    expect(screen.getByText(/excel \(\.xlsx\)/i)).toBeDefined();
    expect(screen.getByText(/csv \(\.csv\)/i)).toBeDefined();
  });

  it('calls exportAs with corresponding format when clicked', () => {
    const mockExportAs = vi.fn();
    vi.spyOn(exportHook, 'useLibraryExport').mockReturnValue({
      exportAs: mockExportAs,
      isExporting: false,
      canExport: true,
      disabledReason: undefined,
    });

    render(<ExportMenu entity="rooms" totalCount={8} />);
    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    const xlsxItem = screen.getByText(/excel \(\.xlsx\)/i);
    fireEvent.click(xlsxItem);

    expect(mockExportAs).toHaveBeenCalledWith('xlsx');
  });
});
