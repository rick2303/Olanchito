import { permanentRedirect } from "next/navigation";

type Props = {
  params: { slug: string };
};

export default function BusinessDetailRedirect({ params }: Props) {
  permanentRedirect(`/negocios/${params.slug}`);
}
