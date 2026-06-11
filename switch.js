export function Switch({ checked, onChange, className }) {
    return (
      <button className={className} onClick={() => onChange(!checked)}>
        {checked ? "ON" : "OFF"}
      </button>
    );
  }