import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Erreur d&apos;authentification</CardTitle>
          <CardDescription>Le lien de confirmation est invalide ou a expiré</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Veuillez réessayer de vous connecter ou créer un nouveau compte.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/sign-up">Créer un compte</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
