@@ -69,7 +69,7 @@
         <h1 className="text-3xl font-bold mb-2">Konfigurace tabulek Google</h1>
         <p className="text-muted-foreground">
           nastavte své tabulky kontaktů a blacklistu
-        </p>
+        </p>
       </div>
 
       <form onSubmit={handleSubmit} className="space-y-6">
@@ -117,7 +117,7 @@
             type="button"
             variant="outline"
             onClick={() => router.push('/setup/gemini-setup')}
-          >
+>
             zpět
           </Button>
           <Button
@@ -135,7 +135,7 @@
 
 <boltAction type="file" filePath="app/setup/google-auth/page.tsx">
@@ -159,7 +159,7 @@
         <h1 className="text-3xl font-bold mb-2">Propojte účet google</h1>
         <p className="text-muted-foreground">
           potřebujeme přístup k tabulkám google pro kontakty a gmail pro odesílání emailů
-        </p>
+        </p>
       </div>
 
       <div className="space-y-6 mb-8">
@@ -180,7 +180,7 @@
           onClick={handleGoogleAuth}
           disabled={loading}
         >
-          {loading ? 'připojování...' : 'propojit účet google'}
+          {loading ? 'připojování...' : 'Propojit účet Google'}
         </Button>
       </div>
     </Card>
