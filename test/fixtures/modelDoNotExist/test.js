
export default async function ({ getByTestId }) {
  expect(getByTestId('error').innerHTML).toEqual('component should not break');
  expect(getByTestId('ret').innerHTML).toEqual('ret is: undefined');
}
