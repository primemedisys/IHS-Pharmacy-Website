"use client";

import type { IconBaseProps } from "react-icons";
import * as FiIcons from "react-icons/fi";

export interface IconProps extends IconBaseProps {
  name: string;
}

const registry = FiIcons as unknown as Record<string, React.ComponentType<IconBaseProps>>;

export function Icon({ name, ...props }: IconProps) {
  const Glyph = registry[name] ?? FiIcons.FiCircle;
  return <Glyph aria-hidden {...props} />;
}
