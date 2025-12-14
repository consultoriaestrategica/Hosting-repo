import { Suspense } from "react"
import ContractDetailPageClient from "./ContractDetailPageClient"

type ContractPageProps = {
  params: Promise<{ id: string }>
}

// ⚠️ Next.js genera tipos incorrectos en `.next/types/...`
// usamos `any` para mantener compatibilidad en modo standalone
// sin romper el render dinámico
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ContractDetailPage(props: any) {
  // Si los params vienen como promesa (bug de tipado), resolvemos:
  const params = await props.params
  const { id } = params as { id: string }

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ContractDetailPageClient id={id} />
    </Suspense>
  )
}
