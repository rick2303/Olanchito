import { redirect } from "next/navigation";

type Props = {
  params: { slug: string };
};

export default function BusinessDetailRedirect({ params }: Props) {
  redirect(`/negocios/${params.slug}`);
}
