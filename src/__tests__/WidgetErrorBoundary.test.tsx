/**
 * WidgetErrorBoundary tests.
 *
 * REQ: Widget Error Boundary — catches render errors thrown by a widget
 * subtree, shows a fallback instead of crashing, and resets when re-keyed
 * (React remounts on key change).
 */
import { act } from 'react';
import { Text } from 'react-native';
import { render, screen, cleanup } from '@testing-library/react-native';
import { WidgetErrorBoundary } from '../form/WidgetErrorBoundary';

afterEach(async () => {
  await cleanup();
});

function Throws(): React.ReactElement {
  throw new Error('boom');
}

function Healthy() {
  return <Text testID="healthy-child">OK</Text>;
}

describe('WidgetErrorBoundary', () => {
  it('renders children when there is no error', async () => {
    await render(
      <WidgetErrorBoundary fallback={<Text testID="fallback">Fallback</Text>}>
        <Healthy />
      </WidgetErrorBoundary>,
    );
    expect(screen.getByTestId('healthy-child')).toBeTruthy();
    expect(screen.queryByTestId('fallback')).toBeNull();
  });

  it('renders the fallback when a child throws during render', async () => {
    // React logs the caught error to console.error during commit — suppress
    // the expected noise for this test.
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await render(
      <WidgetErrorBoundary fallback={<Text testID="fallback">Fallback</Text>}>
        <Throws />
      </WidgetErrorBoundary>,
    );
    expect(screen.getByTestId('fallback')).toBeTruthy();
    errorSpy.mockRestore();
  });

  it('resets to fresh (non-error) state when re-keyed', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // React only reconciles `key` among SIBLINGS sharing the SAME parent
    // fiber (exactly how Form.tsx uses it — the boundary is a child, keyed
    // by ev.index, inside renderContent's returned View). A List host
    // makes that parent explicit here so the key-based remount is exercised
    // the same way, rather than relying on testing-library's implicit root.
    function List({ index, throwing }: { index: number; throwing: boolean }) {
      return (
        <WidgetErrorBoundary
          key={index}
          fallback={<Text testID="fallback">Fallback</Text>}
        >
          {throwing ? <Throws /> : <Healthy />}
        </WidgetErrorBoundary>
      );
    }
    const { rerender } = await render(<List index={0} throwing />);
    expect(screen.getByTestId('fallback')).toBeTruthy();

    await act(async () => {
      rerender(<List index={1} throwing={false} />);
    });
    expect(screen.getByTestId('healthy-child')).toBeTruthy();
    expect(screen.queryByTestId('fallback')).toBeNull();
    errorSpy.mockRestore();
  });
});
