import { permanentRedirect } from "next/navigation";

type Props = { params: { slug: string } };

export default function CategoryRedirect({ params }: Props) {
  permanentRedirect(`/categorias/${params.slug}`);
}
