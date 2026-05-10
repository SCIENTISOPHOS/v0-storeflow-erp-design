import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Compte créé!</CardTitle>
          <CardDescription>Vérifiez votre email pour confirmer votre inscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground text-pretty">
            Nous vous avons envoyé un email de confirmation. Cliquez sur le lien dans l&apos;email pour activer
            votre compte, puis revenez vous connecter.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Aller à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
