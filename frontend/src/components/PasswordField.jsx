import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  autoComplete,
  required = true,
  describedBy,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a706a]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          required={required}
          className="soft-input pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-2 flex w-10 items-center justify-center rounded-lg text-[#7a706a] hover:bg-black/5 hover:text-[#1b1714] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#946f2d]"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
