import { redirect } from "next/navigation";

type Props = { params: { slug: string } };

export default function CategoryRedirect({ params }: Props) {
  redirect(`/categorias/${params.slug}`);
}
