export function Checkbox({ checked, onCheckedChange, ...props }) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={e => onCheckedChange?.(e.target.checked)}
      className="w-4 h-4 accent-black"
      {...props}
    />
  );
}
