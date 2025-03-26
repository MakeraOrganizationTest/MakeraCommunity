"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Menu,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu"
import ThemeModeButton from "@/components/theme-mode-button"
import UserAvatar from "@/components/user-avatar"
import { Logo } from "@/components/logo"

// Model categories
const modelCategories = [
  {
    title: "AI Models",
    href: "/models/ai",
    description: "Various artificial intelligence models for text generation, image recognition, etc.",
  },
  {
    title: "3D Models",
    href: "/models/3d",
    description: "3D modeling, game assets, scene models and object models",
  },
  {
    title: "Image Models",
    href: "/models/image",
    description: "Image processing, style transfer, super-resolution and other image-related models",
  },
  {
    title: "Text Models",
    href: "/models/text",
    description: "Natural language processing, text analysis, sentiment analysis and other text-related models",
  },
  {
    title: "Voice Models",
    href: "/models/voice",
    description: "Speech synthesis, speech recognition, voice conversion and other voice-related models",
  },
]

// Maker space items
const makerSpaceItems = [
  {
    title: "Maker Tools",
    href: "/maker-space/tools",
    description: "Various tools and resources for makers",
  },
  {
    title: "Tutorials",
    href: "/maker-space/tutorials",
    description: "Detailed tutorials for creating and using various models",
  },
  {
    title: "Resources",
    href: "/maker-space/resources",
    description: "Various materials, resource libraries and references",
  },
]

// Competition items
const competitionItems = [
  {
    title: "Current Contests",
    href: "/competitions/current",
    description: "Various ongoing competitions and challenges",
  },
  {
    title: "Upcoming Events",
    href: "/competitions/upcoming",
    description: "Competitions and events starting soon",
  },
  {
    title: "Past Competitions",
    href: "/competitions/past",
    description: "Completed competitions and showcases of winning works",
  },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Simplified search function
  const handleSearch = () => {
    router.push("/search")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur transition-all duration-300">
      <div className="max-w-[1920px] w-full mx-auto flex h-14 items-center px-4 lg:px-6">
        <div className="flex w-full items-center justify-between">
          {/* Left side with logo and navigation */}
          <div className="flex items-center gap-4">
            {/* Logo and brand name */}
            <Logo />

            {/* Desktop navigation menu - left aligned */}
            <div className="hidden md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {/* Models */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center h-9">
                      Models
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                        {modelCategories.map((category) => (
                          <ListItem
                            key={category.href}
                            title={category.title}
                            href={category.href}
                            className={cn(
                              pathname === category.href && "bg-accent"
                            )}
                          >
                            {category.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Competitions */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center h-9">
                      Competitions
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <a
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/"
                            >
                              <div className="mb-2 mt-4 text-lg font-medium">
                                shadcn/ui
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Beautifully designed components built with Radix UI and
                                Tailwind CSS.
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </li>
                        {competitionItems.map((item) => (
                          <ListItem
                            key={item.href}
                            title={item.title}
                            href={item.href}
                            className={cn(
                              pathname === item.href && "bg-accent"
                            )}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Maker Space */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center h-9">
                      Maker Space
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {makerSpaceItems.map((item) => (
                          <ListItem
                            key={item.href}
                            title={item.title}
                            href={item.href}
                            className={cn(
                              pathname === item.href && "bg-accent"
                            )}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Forum */}
                  <NavigationMenuItem>
                    <NavigationMenuLink href="https://forum.makera.com/" target="_blank" className="flex items-center h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground group">
                      <div className="flex items-center">
                        Forum
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle button */}
            <ThemeModeButton />
            
            {/* Search button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* User actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <UserAvatar />
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <div 
        className={cn(
          "container px-4 sm:px-6 lg:px-8 md:hidden overflow-hidden",
          mobileMenuOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col space-y-2 py-4">
          {/* Mobile theme toggle and search button */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              className="flex items-center justify-start px-2 py-2 text-sm"
              onClick={() => {
                handleSearch();
                setMobileMenuOpen(false);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            
            <ThemeModeButton />
          </div>
          
          {/* Models */}
          <div className="flex flex-col">
            <div className="flex items-center px-2 py-2 text-sm font-medium">
              Models
            </div>
            <div className="ml-6 flex flex-col space-y-1 border-l pl-2">
              {modelCategories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className={cn(
                    "px-2 py-1.5 text-sm transition-colors hover:text-foreground/80",
                    pathname === category.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Competitions */}
          <div className="flex flex-col">
            <div className="flex items-center px-2 py-2 text-sm font-medium">
              Competitions
            </div>
            <div className="ml-6 flex flex-col space-y-1 border-l pl-2">
              {competitionItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2 py-1.5 text-sm transition-colors hover:text-foreground/80",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Maker Space */}
          <div className="flex flex-col">
            <div className="flex items-center px-2 py-2 text-sm font-medium">
              Maker Space
            </div>
            <div className="ml-6 flex flex-col space-y-1 border-l pl-2">
              {makerSpaceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2 py-1.5 text-sm transition-colors hover:text-foreground/80",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Forum */}
          <div className="flex flex-col">
            <Link
              href="https://forum.makera.com/"
              target="_blank"
              className="flex items-center px-2 py-2 text-sm font-medium hover:text-foreground/80 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              Forum
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

// Navigation menu item component
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}) 