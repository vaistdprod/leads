@@ -331,7 +331,7 @@
           <Button type="submit">Save Settings</Button>
         </form>
       </Form>
-
+      
       <div className="mt-8">
         <Button onClick={() => router.back()}>Go Back</Button>
         <Button onClick={() => setShowMockSheet(!showMockSheet)}>
@@ -349,7 +349,7 @@

 <boltAction type="file" filePath="app/settings/ai/page.tsx">
@@ -499,7 +499,7 @@
           </form>
         </Form>
         <Button onClick={() => router.back()}>zpět</Button>
-      </Card>
+    </Card>
     </div>
   );
 }
