"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 这里实现搜索逻辑
    console.log("搜索:", searchQuery)
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">搜索 🔍</h1>
      
      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSearch} className="mb-8 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索模型、教程、竞赛..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>

        {searchQuery ? (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              搜索结果将显示在这里
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4 hover:bg-accent"
                >
                  <h3 className="mb-1 text-lg font-medium">搜索结果 {i + 1}</h3>
                  <p className="text-sm text-muted-foreground">
                    这是一个示例搜索结果，展示了与 "{searchQuery}" 相关的内容
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h2 className="mb-2 text-lg font-medium">搜索模型、教程或竞赛</h2>
            <p className="text-sm text-muted-foreground">
              在上方输入关键词开始搜索
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 