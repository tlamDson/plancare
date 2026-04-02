import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

export type SearchPickerItem = {
  value: string;
  label: ReactNode;
  filterText: string;
  highlight?: boolean;
};

type DestinationSearchPickerProps = {
  items: SearchPickerItem[];
  value: string;
  onValueChange: (v: string) => void;
  triggerLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function DestinationSearchPicker({
  items,
  value,
  onValueChange,
  triggerLabel,
  searchPlaceholder,
  emptyLabel,
  open,
  onOpenChange,
}: DestinationSearchPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {triggerLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {items.map((it) => (
                <CommandItem
                  key={it.value}
                  value={`${it.filterText} ${it.value}`}
                  onSelect={() => {
                    onValueChange(it.value);
                    onOpenChange(false);
                  }}
                  className={cn(
                    it.highlight &&
                      "border-l-2 border-primary bg-primary/5 pl-2 font-medium text-primary",
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === it.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
