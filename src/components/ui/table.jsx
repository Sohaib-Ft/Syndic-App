const mergeClassNames = (...classes) => classes.filter(Boolean).join(' ');

const Table = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table className={mergeClassNames('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);

const TableHeader = ({ className, ...props }) => (
  <thead className={mergeClassNames('[&_tr]:border-b', className)} {...props} />
);

const TableBody = ({ className, ...props }) => (
  <tbody className={mergeClassNames('[&_tr:last-child]:border-0', className)} {...props} />
);

const TableFooter = ({ className, ...props }) => (
  <tfoot className={mergeClassNames('border-t bg-slate-50/50 font-medium [&>tr]:last:border-b-0', className)} {...props} />
);

const TableRow = ({ className, ...props }) => (
  <tr className={mergeClassNames('border-b transition-colors hover:bg-slate-50/60 data-[state=selected]:bg-slate-50', className)} {...props} />
);

const TableHead = ({ className, ...props }) => (
  <th
    className={mergeClassNames(
      'h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
);

const TableCell = ({ className, ...props }) => (
  <td className={mergeClassNames('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
);

const TableCaption = ({ className, ...props }) => (
  <caption className={mergeClassNames('mt-4 text-sm text-slate-500', className)} {...props} />
);

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
};
