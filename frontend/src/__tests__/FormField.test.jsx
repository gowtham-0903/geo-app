import { render, screen } from '@testing-library/react';
import FormField, { Input, Select, Textarea } from '../components/FormField';

describe('FormField', () => {
  it('renders label text', () => {
    render(<FormField label="Email Address"><input /></FormField>);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('renders children inside the field', () => {
    render(
      <FormField label="Name">
        <input placeholder="Enter name" />
      </FormField>
    );
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('renders error message when error prop provided', () => {
    render(
      <FormField label="Email" error="Email is required">
        <input />
      </FormField>
    );
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('does not render error element when no error prop', () => {
    render(<FormField label="Email"><input /></FormField>);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});

describe('Input component', () => {
  it('renders with correct placeholder', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('applies type attribute correctly', () => {
    render(<Input type="number" data-testid="num" />);
    expect(screen.getByTestId('num')).toHaveAttribute('type', 'number');
  });

  it('passes through additional props', () => {
    render(<Input data-testid="my-input" disabled />);
    expect(screen.getByTestId('my-input')).toBeDisabled();
  });

  it('merges extra className with base classes', () => {
    render(<Input className="extra-class" data-testid="inp" />);
    expect(screen.getByTestId('inp').className).toContain('extra-class');
  });
});

describe('Select component', () => {
  it('renders options correctly', () => {
    render(
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('reflects selected value', () => {
    render(
      <Select value="b" onChange={() => {}}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveValue('b');
  });
});

describe('Textarea component', () => {
  it('renders as a textarea element', () => {
    render(<Textarea placeholder="Notes" />);
    expect(screen.getByPlaceholderText('Notes').tagName).toBe('TEXTAREA');
  });
});
