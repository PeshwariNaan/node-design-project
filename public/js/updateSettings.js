/* eslint-disable */
import { showAlert } from './alerts';
// updateData function - This is implemented after we did the initial method for updating user data that didn't need the api.
// The error handling was a little janky so we are know doing update with api call
export const updateData = async (name, email) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: {
        name,
        email,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Data updated successfully!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
