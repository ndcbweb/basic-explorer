/** Plain GET form so lookups are shareable URLs and work without client JS. */
export default function LookupForm({ action, fields, submitLabel = "Lookup" }) {
  return (
    <form action={action} method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {fields.map((field) => (
        <div key={field.name} className="min-w-0 flex-1">
          <label htmlFor={`lf-${field.name}`} className="mb-1.5 block text-sm font-medium text-ink">
            {field.label}
          </label>
          <input
            id={`lf-${field.name}`}
            name={field.name}
            defaultValue={field.value || ""}
            placeholder={field.placeholder || "0x…"}
            className={`field ${field.mono === false ? "" : "mono"}`}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      ))}
      <button type="submit" className="btn-primary shrink-0">
        {submitLabel}
      </button>
    </form>
  );
}
