import { useState } from 'react'

function isBlank(input) {
  return input.type === 'password' ? !input.value : !input.value.trim()
}

export function useRequiredFields() {
  const [invalidField, setInvalidField] = useState('')

  function validate(form) {
    const missing = Array.from(form.querySelectorAll('input[required]:enabled')).find(isBlank)
    setInvalidField(missing?.name ?? '')
    missing?.focus()
    return !missing
  }

  function clearFieldError(event) {
    const input = event.target
    if (invalidField && input.name === invalidField && !isBlank(input)) setInvalidField('')
  }

  return { invalidField, validate, clearFieldError }
}
