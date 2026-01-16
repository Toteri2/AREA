import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className='not-found'>
      <h1>404</h1>
      <h2>Not found</h2>
      <p>Oups… the page you are looking for doesn't exist.</p>

      <button type='button' className='back-home' onClick={() => navigate(-1)}>
        Go back
      </button>
    </div>
  );
}

export { NotFound };
export default NotFound;
