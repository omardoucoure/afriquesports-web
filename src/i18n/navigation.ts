import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Create and export navigation utilities
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
