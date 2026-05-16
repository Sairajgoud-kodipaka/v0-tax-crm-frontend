import * as React from 'react';

import { nativeSelectClassName } from '@/lib/native-select-styles';
import { cn } from '@/lib/utils';

function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(nativeSelectClassName, className)} {...props} />;
}

export { NativeSelect, nativeSelectClassName };
