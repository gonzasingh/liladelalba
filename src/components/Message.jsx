// type: "info" | "error" | "success"
export default function Message({ type = 'info', title, children, action }) {
  return (
    <div className={`message message--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {title && <h2 className="message__title">{title}</h2>}
      {children && <p className="message__text">{children}</p>}
      {action && <div className="message__action">{action}</div>}
    </div>
  );
}
