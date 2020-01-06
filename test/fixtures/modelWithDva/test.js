
export default async function ({ getByTestId, getByText, fireEvent, context }) {
  expect(getByTestId('dva').innerHTML).toEqual('undefined');
}
