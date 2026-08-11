"use client"

import { type FormEvent, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"


const SearchBar = () => { 
  const [search, setSearch] = useState("")
  

  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(`/barbershops?search=${encodeURIComponent(search.trim())}`)
  }

    return (
      <form className="flex w-full items-center gap-2" onSubmit={handleSubmit}>
      <Input
        placeholder="Pesquise por barbearias e serviços..."
        className="h-11 rounded-full bg-background px-5 lg:h-12 lg:text-base"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Button
        type="submit"
        size="icon"
        variant="outline"
        className="h-11 w-11 shrink-0 cursor-pointer rounded-full bg-[#254F50] hover:bg-[#1d4142] lg:h-12 lg:w-12"
      >
        <SearchIcon className="text-[#C3F32C]" />
      </Button>
    </form>
  )
}

export default SearchBar
