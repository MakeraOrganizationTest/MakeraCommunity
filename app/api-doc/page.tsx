import { getApiDocs } from '@/lib/swagger'
import ReactSwagger from './react-swagger'

export default async function IndexPage() {
  const spec = await getApiDocs()
  return (
    <section className="mx-auto w-full max-w-[1440px]">
      <ReactSwagger spec={spec} />
    </section>
  )
}
