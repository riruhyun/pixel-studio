import { useId } from 'react'

export default function RequiredField({ label, invalid, message, ...props }) {
  const errorId = useId()

  return (
    <label>
      {label}
      <input {...props} required aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined} />
      {invalid && <small className="field-error" id={errorId} role="alert">{message}</small>}
    </label>
  )
}
