import { Search } from "lucide-react"
import { InputGroup, InputGroupButton, InputGroupInput } from "./ui/input-group"

// components/SearchForm.tsx
interface SearchFormProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: React.FormEvent) => void
  onFocus?: () => void
  autoFocus?: boolean
}

export const SearchForm = ({
  value,
  onChange,
  onSubmit,
  onFocus,
  autoFocus,
}: SearchFormProps) => {
  return (
    <form role="search" onSubmit={onSubmit} className="mx-auto w-full max-w-lg">
      <label htmlFor="site-search" className="sr-only">
        Search videos
      </label>
      <InputGroup className="h-10 overflow-hidden rounded-full border border-border/80 bg-muted/40 transition-colors focus-within:border-primary/60">
        <InputGroupInput
          id="site-search"
          name="q"
          type="search"
          placeholder="Search..."
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          autoComplete="off"
          autoFocus={autoFocus}
          className="bg-transparent px-4 text-sm"
        />
        <InputGroupButton
          type="submit"
          className="h-full cursor-pointer rounded-s-none px-4 transition-all active:scale-95 disabled:opacity-40"
          disabled={!value.trim()}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Submit search</span>
        </InputGroupButton>
      </InputGroup>
    </form>
  )
}
