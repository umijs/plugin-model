
export default async function ({ getByTestId }) {
  expect(getByTestId('user').innerHTML).toEqual('Troy is an adult');
}
