import { useParams, useNavigate, useLocation } from 'react-router-dom';

function withRouter(Component) {
  return (props) => {
    const location = useLocation();
    return (
      <Component {...props} params={useParams()} navigate={useNavigate()} location={location} />
    );
  };
}

export default withRouter;