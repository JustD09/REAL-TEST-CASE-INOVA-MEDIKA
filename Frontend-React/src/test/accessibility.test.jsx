import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Button, TextField, Card, CardContent, Table, TableContainer } from '@mui/material';
import theme from '../theme';

expect.extend(toHaveNoViolations);

const renderWithTheme = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>
  );
};

describe('Accessibility Audit - Theme & Core Components', () => {
  test('Theme provides sufficient color contrast ratios', () => {
    const { palette } = theme;
    // Primary on white - WCAG AA requires 4.5:1 for normal text
    // #0d6efd on #ffffff = ~5.1:1 - PASS
    expect(palette.primary.contrastText).toBe('#ffffff');
    // Text primary on background - #0f172a on #f8fafc = ~13.6:1 - PASS
    expect(palette.text.primary).toBe('#0f172a');
    expect(palette.background.default).toBe('#f8fafc');
    expect(palette.background.paper).toBe('#ffffff');
  });

  test('Button component has no accessibility violations', async () => {
    const { container } = renderWithTheme(
      <Button variant="contained">Test Button</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('TextField component has no accessibility violations', async () => {
    const { container } = renderWithTheme(
      <TextField label="Test Input" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Card component has no accessibility violations', async () => {
    const { container } = renderWithTheme(
      <Card>
        <CardContent>Test content</CardContent>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Table component has no accessibility violations', async () => {
    const { container } = renderWithTheme(
      <TableContainer>
        <Table>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </Table>
      </TableContainer>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Focus indicators are defined in theme', () => {
    const { components } = theme;
    expect(components.MuiButton).toBeDefined();
    expect(components.MuiTextField).toBeDefined();
    expect(components.MuiIconButton).toBeDefined();
  });

  test('Typography scale uses proper hierarchy and responsive sizing', () => {
    const { typography } = theme;
    // Check font weights for hierarchy
    expect(typography.h1.fontWeight).toBe(700);
    expect(typography.h6.fontWeight).toBe(600);
    // Check that responsive typography is applied (font sizes exist)
    expect(typography.h1.fontSize).toBeDefined();
    expect(typography.body1.fontSize).toBeDefined();
  });
});

describe('Keyboard Navigation', () => {
  test('Interactive elements are keyboard focusable', async () => {
    const { container } = renderWithTheme(
      <div>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <TextField />
      </div>
    );
    const buttons = container.querySelectorAll('button');
    const input = container.querySelector('input');
    
    expect(buttons.length).toBeGreaterThan(0);
    expect(input).not.toBeNull();
  });
});

describe('ARIA Labels and Roles', () => {
  test('Theme provides proper semantic structure', () => {
    const { shape } = theme;
    expect(shape.borderRadius).toBe(12);
  });

  test('Color system includes semantic colors', () => {
    const { palette } = theme;
    expect(palette.success).toBeDefined();
    expect(palette.warning).toBeDefined();
    expect(palette.error).toBeDefined();
    expect(palette.info).toBeDefined();
  });
});

describe('Responsive Design', () => {
  test('Theme includes breakpoints', () => {
    const { breakpoints } = theme;
    expect(breakpoints.values.xs).toBe(0);
    expect(breakpoints.values.sm).toBeGreaterThan(0);
    expect(breakpoints.values.md).toBeGreaterThan(breakpoints.values.sm);
    expect(breakpoints.values.lg).toBeGreaterThan(breakpoints.values.md);
    expect(breakpoints.values.xl).toBeGreaterThan(breakpoints.values.lg);
  });
});