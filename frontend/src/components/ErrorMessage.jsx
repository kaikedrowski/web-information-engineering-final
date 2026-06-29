function ErrorMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="error-message text-danger">
      <p>Error: {message}</p>
    </div>
  );
}

export default ErrorMessage;
