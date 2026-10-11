"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { GraduationCap, LogIn, Menu, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
  { label: "স্টুডেন্ট ড্যাশবোর্ড", href: "/dashboard" },
  { label: "হোম", href: "/" },
  { label: "কোর্সসমূহ", href: "/#courses" },
  { label: "ভিডিও ক্লাস", href: "/#videos" },
  { label: "কোর্স প্ল্যান", href: "/#pricing" },
  { label: "সাধারণ জিজ্ঞাসা", href: "/#faq" },
];

const focusStyle =
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-sky-500 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

const loginStyle =
  "group rounded-full bg-sky-700 text-white " +
  "hover:bg-sky-800 hover:text-white " +
  "dark:bg-sky-700 dark:text-white dark:hover:bg-sky-800 " +
  "transition duration-200 motion-safe:hover:-translate-y-0.5 " +
  "hover:shadow-lg hover:shadow-sky-900/15 motion-reduce:transition-none";

export default function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  function isActive(href: string) {
    // Section links don't get a permanent active style.
    // Otherwise every homepage section would appear active together.
    if (href.includes("#")) return false;

    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkStyle(href: string) {
    return cn(
      "font-medium transition-colors",
      focusStyle,
      isActive(href)
        ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
        : [
            "text-slate-600 hover:bg-sky-50 hover:text-sky-800",
            "dark:text-slate-300 dark:hover:bg-slate-800",
            "dark:hover:text-sky-200",
          ],
    );
  }

  return (
    <header
      lang="bn"
      className="
        fixed inset-x-0 top-0 z-50
        border-b border-slate-200/70
        bg-white/80 text-slate-900
        backdrop-blur-xl
        dark:border-slate-800/80
        dark:bg-slate-950/80 dark:text-slate-100
      "
    >
      <div
        className="
          mx-auto grid h-[72px] max-w-7xl
          grid-cols-[1fr_auto] items-center gap-3
          px-4 sm:px-6
          lg:grid-cols-[1fr_auto_1fr] lg:px-8
        "
      >
        {/* Brand */}
        <Link
          href="/"
          aria-label="Aarohon হোমপেজ"
          className={cn(
            "flex w-fit items-center gap-2.5 rounded-xl",
            focusStyle,
          )}
        >
          <span
            className="
              flex size-10 shrink-0 items-center justify-center
              rounded-xl bg-sky-700 text-white
              shadow-sm shadow-sky-900/15
            "
          >
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>

          <span className="text-xl font-bold tracking-tight">Aarohon</span>
        </Link>

        {/* Desktop menu */}
        <nav
          aria-label="প্রধান মেনু"
          className="hidden items-center gap-1 lg:flex"
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm",
                linkStyle(item.href),
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Theme and login */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="লাইট ও ডার্ক মোড পরিবর্তন করুন"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className={cn(
              "relative size-10 rounded-full border",
              "border-slate-200 bg-white/50 text-slate-700",
              "hover:bg-sky-50 hover:text-sky-800",
              "dark:border-slate-700 dark:bg-slate-900/60",
              "dark:text-sky-200 dark:hover:bg-slate-800",
              "dark:hover:text-sky-100",
              focusStyle,
            )}
          >
            <Sun
              aria-hidden="true"
              className="
                size-[18px] rotate-0 scale-100
                transition-transform dark:-rotate-90 dark:scale-0
                motion-reduce:transition-none
              "
            />

            <Moon
              aria-hidden="true"
              className="
                absolute size-[18px] rotate-90 scale-0
                transition-transform dark:rotate-0 dark:scale-100
                motion-reduce:transition-none
              "
            />
          </Button>

          {/* Connect /login to your authentication page later. */}
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "default" }),
              loginStyle,
              focusStyle,
              "hidden gap-2 px-5 lg:inline-flex",
            )}
          >
            <LogIn className="size-4" aria-hidden="true" />
            লগইন
          </Link>

          {/* Mobile drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="মেনু খুলুন"
                className={cn(
                  "size-10 rounded-full lg:hidden",
                  "border-slate-200 bg-white/50 text-slate-700",
                  "hover:bg-sky-50 hover:text-sky-800",
                  "dark:border-slate-700 dark:bg-slate-900/60",
                  "dark:text-slate-200 dark:hover:bg-slate-800",
                  "dark:hover:text-white",
                  focusStyle,
                )}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              lang="bn"
              className="
                flex w-[min(340px,100vw)] flex-col
                border-slate-200 bg-white text-slate-900
                dark:border-slate-800 dark:bg-slate-950
                dark:text-slate-100
              "
            >
              <SheetHeader
                className="
                  border-b border-slate-200 pb-6 text-left
                  dark:border-slate-800
                "
              >
                <SheetTitle className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
                  <span
                    className="
                      flex size-9 items-center justify-center
                      rounded-xl bg-sky-700 text-white
                    "
                  >
                    <GraduationCap className="size-5" aria-hidden="true" />
                  </span>

                  <span className="text-xl font-bold">Aarohon</span>
                </SheetTitle>

                <SheetDescription className="pt-2 text-slate-600 dark:text-slate-300">
                  আপনার আগামী, আপনার প্রস্তুতি।
                </SheetDescription>
              </SheetHeader>

              <nav
                aria-label="মোবাইল মেনু"
                className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
              >
                {menuItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-xl px-4 py-3.5 text-sm",
                        linkStyle(item.href),
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      loginStyle,
                      focusStyle,
                      "w-full gap-2",
                    )}
                  >
                    <LogIn className="size-4" aria-hidden="true" />
                    লগইন করুন
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useTheme } from "next-themes";
// import { Code2, Menu, Moon, Sun } from "lucide-react";

// import { cn } from "@/lib/utils";
// import { Button, buttonVariants } from "@/components/ui/button";
// import {
//   Sheet,
//   SheetClose,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";

// const menuItems = [
//   { label: "Home", href: "/" },
//   { label: "Services", href: "/services" },
//   { label: "About", href: "/about" },
//   { label: "Contact", href: "/contact" },
// ];

// export default function Navbar() {
//   const pathname = usePathname();
//   const { resolvedTheme, setTheme } = useTheme();

//   function isActive(href: string) {
//     return href === "/"
//       ? pathname === "/"
//       : pathname === href || pathname.startsWith(`${href}/`);
//   }

//   return (
//     <header
//   className="
//     fixed inset-x-0 top-0 z-50
//     border-b border-white/10
//     bg-background/40
//     backdrop-blur-xl
//   "
// >
//       <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr] sm:px-6 lg:px-8">
//         {/* Logo */}
//         <Link
//           href="/"
//           aria-label="BytesBrew home"
//           className="flex w-fit items-center gap-2 font-bold tracking-tight"
//         >
//           <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
//             <Code2 className="size-5" aria-hidden="true" />
//           </span>

//           <span className="text-lg">Aarohon</span>
//         </Link>

//         {/* Desktop navigation */}
//         <nav
//           aria-label="Main navigation"
//           className="hidden items-center gap-1 md:flex"
//         >
//           {menuItems.map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               aria-current={isActive(item.href) ? "page" : undefined}
//               className={cn(
//                 "rounded-full px-4 py-2 text-sm font-medium transition-colors",
//                 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
//                 isActive(item.href)
//                   ? "bg-secondary text-foreground"
//                   : "text-muted-foreground hover:bg-accent hover:text-foreground"
//               )}
//             >
//               {item.label}
//             </Link>
//           ))}
//         </nav>

//         {/* Right-side actions */}
//         <div className="flex items-center justify-end gap-2">
//           <Button
//             type="button"
//             variant="ghost"
//             size="icon"
//             className="relative rounded-full"
//             aria-label="Toggle light and dark mode"
//             onClick={() =>
//               setTheme(resolvedTheme === "dark" ? "light" : "dark")
//             }
//           >
//             <Sun
//               aria-hidden="true"
//               className="size-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
//             />
//             <Moon
//               aria-hidden="true"
//               className="absolute size-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
//             />
//           </Button>

//           <Link
//             href="/login"
//             className={cn(
//               buttonVariants({ size: "lg" }),
//               "hidden rounded-full px-5 md:inline-flex"
//             )}
//           >
//             Log in
//           </Link>

//           {/* Mobile navigation */}
//           <Sheet>
//             <SheetTrigger asChild>
//               <Button
//                 type="button"
//                 variant="outline"
//                 size="icon"
//                 className="rounded-full md:hidden"
//                 aria-label="Open navigation menu"
//               >
//                 <Menu className="size-5" aria-hidden="true" />
//               </Button>
//             </SheetTrigger>

//             <SheetContent
//               side="right"
//               className="w-[min(320px,100vw)] md:hidden"
//             >
//               <SheetHeader className="border-b text-left">
//                 <SheetTitle>BytesBrew</SheetTitle>
//                 <SheetDescription>
//                   Explore our website.
//                 </SheetDescription>
//               </SheetHeader>

//               <nav
//                 aria-label="Mobile navigation"
//                 className="flex flex-col gap-2 px-4 py-4"
//               >
//                 {menuItems.map((item) => (
//                   <SheetClose key={item.href} asChild>
//                     <Link
//                       href={item.href}
//                       aria-current={
//                         isActive(item.href) ? "page" : undefined
//                       }
//                       className={cn(
//                         "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
//                         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
//                         isActive(item.href)
//                           ? "bg-secondary text-foreground"
//                           : "text-muted-foreground hover:bg-accent hover:text-foreground"
//                       )}
//                     >
//                       {item.label}
//                     </Link>
//                   </SheetClose>
//                 ))}
//               </nav>

//               <div className="mt-auto border-t p-4">
//                 <SheetClose asChild>
//                   <Link
//                     href="/login"
//                     className={cn(
//                       buttonVariants(),
//                       "w-full rounded-xl"
//                     )}
//                   >
//                     Log in
//                   </Link>
//                 </SheetClose>
//               </div>
//             </SheetContent>
//           </Sheet>
//         </div>
//       </div>
//     </header>
//   );
// }
