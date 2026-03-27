
import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";
import { addMonths, addYears } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CustomCaption(props: CaptionProps) {
  const { goToMonth } = useNavigation();
  const { displayMonth } = props;

  const btnClass = cn(
    buttonVariants({ variant: "outline" }),
    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
  );

  return (
    <div className="flex justify-center pt-1 relative items-center">
      <button
        type="button"
        onClick={() => goToMonth(addYears(displayMonth, -1))}
        className={cn(btnClass, "absolute left-0")}
        title="Năm trước"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToMonth(addMonths(displayMonth, -1))}
        className={cn(btnClass, "absolute left-8")}
        title="Tháng trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="text-sm font-medium">
        {props.displayMonth.toLocaleString("default", { month: "2-digit" })}/{props.displayMonth.getFullYear()}
      </div>
      <button
        type="button"
        onClick={() => goToMonth(addMonths(displayMonth, 1))}
        className={cn(btnClass, "absolute right-8")}
        title="Tháng sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToMonth(addYears(displayMonth, 1))}
        className={cn(btnClass, "absolute right-0")}
        title="Năm sau"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "hidden",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn(
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          "[&:nth-child(1)]:text-red-600 [&:nth-child(1)]:font-bold",
          "[&:nth-child(7)]:text-blue-600 [&:nth-child(7)]:font-bold"
        ),
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          "[&:nth-child(1)]:text-red-600",
          "[&:nth-child(7)]:text-blue-600"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
