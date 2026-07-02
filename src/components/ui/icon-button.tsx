import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface IconButtonProps extends ButtonProps {
  label: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, ...props }, ref) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" ref={ref} {...props} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
