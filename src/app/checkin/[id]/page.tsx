import { notFound } from "next/navigation";
import { CalendarDays, Clock, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { ReceberCredencial } from "./receber-credencial";
import { formatarData, formatarHoras, labelDaCategoria } from "@/lib/activity";

export default async function CheckinPage({ params }: PageProps<"/checkin/[id]">) {
  const { id } = await params;

  const atividade = await prisma.activity.findUnique({ where: { id } });
  if (!atividade) notFound();

  return (
    // Mobile-first: na prática o aluno abre isso pelo celular após escanear o QR.
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {labelDaCategoria(atividade.categoria)}
          </Badge>
          <CardTitle className="text-2xl text-balance">
            {atividade.nome}
          </CardTitle>
          <CardDescription>
            Check-in de horas complementares
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <dl className="space-y-3 text-sm">
            <Linha icone={<Clock className="size-4" />} termo="Carga horária">
              {formatarHoras(atividade.cargaHoraria)}
            </Linha>
            <Linha icone={<CalendarDays className="size-4" />} termo="Data">
              {formatarData(atividade.data)}
            </Linha>
            <Linha icone={<Building2 className="size-4" />} termo="Emitido por">
              {atividade.emissor}
            </Linha>
          </dl>

          <Separator />

          <ReceberCredencial activityId={atividade.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function Linha({
  icone,
  termo,
  children,
}: {
  icone: React.ReactNode;
  termo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icone}</span>
      <dt className="text-muted-foreground">{termo}</dt>
      <dd className="ml-auto font-medium">{children}</dd>
    </div>
  );
}
