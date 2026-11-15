package com.neoegoist.simulator;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.widget.Toast;

import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Blue Lock NEO: Android shell with a fixed HTTPS-style local origin.
 * All browser saves (IndexedDB/localStorage) stay at that origin across web updates.
 * Only game assets are updated; the Android binary remains independent.
 */
public final class MainActivity extends Activity {
    private static final int REQUEST_PICK = 1501;
    private static final int REQUEST_EXPORT = 1502;
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/index.html";
    private static final String BUNDLED_WEB_VERSION = "9.4.0";
    private static final String UPDATE_HOST = "a94330028-cell.github.io";
    private static final String MANIFEST_URL = "https://" + UPDATE_HOST + "/Blue-lock-neo/updates/latest.json";
    private static final String PREFS = "blue_lock_neo_android";
    private static final String PREF_WEB_VERSION = "installed_web_version";
    private static final long MAX_PACKAGE_BYTES = 32L * 1024 * 1024;
    private static final long MAX_UNPACKED_BYTES = 96L * 1024 * 1024;
    private static final int MAX_FILES = 6500;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingExport;
    private volatile File activeContentDirectory;
    private volatile boolean updateBusy = false;

    private static final class UpdateInfo {
        String version;
        String url;
        String sha256;
        int minimumAndroidVersion;
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 17, 31));
        getWindow().setNavigationBarColor(Color.rgb(7, 17, 31));
        File installed = new File(new File(getFilesDir(), "web-updates"), getCurrentWebVersion());
        activeContentDirectory = installed.isDirectory() ? installed : null;
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 17, 31));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // Local game files must never remain stale after installing an APK or web update.
        // This bypasses the resource cache, not localStorage/IndexedDB (saves and portraits).
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.addJavascriptInterface(new AndroidBridge(), "BlueLockAndroid");

        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()))
                    return super.shouldInterceptRequest(view, request);
                return localAsset(uri);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                openExternal(uri);
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivityForResult(intent, REQUEST_PICK);
                } catch (Exception e) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "Não foi possível abrir a galeria", Toast.LENGTH_LONG).show();
                }
                return true;
            }
        });
        setContentView(webView);
        webView.loadUrl(HOME);
        // New content is offered, not installed silently while someone is playing.
        new Handler(Looper.getMainLooper()).postDelayed(() -> checkForUpdates(false), 3500);
    }

    private SharedPreferences preferences() {
        return getSharedPreferences(PREFS, MODE_PRIVATE);
    }
    private String getCurrentWebVersion() {
        String version = preferences().getString(PREF_WEB_VERSION, BUNDLED_WEB_VERSION);
        if (isVersion(version) && compareVersion(version, BUNDLED_WEB_VERSION) > 0) {
            File installed = new File(new File(getFilesDir(), "web-updates"), version);
            if (installed.isDirectory() && new File(installed, "index.html").isFile()) return version;
        }
        return BUNDLED_WEB_VERSION;
    }
    private static boolean isVersion(String s) {
        return s != null && s.matches("[0-9]{1,4}\\.[0-9]{1,4}\\.[0-9]{1,4}");
    }
    private static int compareVersion(String x, String y) {
        String[] a = x.split("\\."), b = y.split("\\.");
        for (int i = 0; i < 3; i++) {
            int n = Integer.parseInt(a[i]) - Integer.parseInt(b[i]);
            if (n != 0) return n < 0 ? -1 : 1;
        }
        return 0;
    }

    private WebResourceResponse localAsset(Uri uri) {
        String path = Uri.decode(uri.getEncodedPath());
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        if (path.contains("..") || path.contains("\\") || path.indexOf('\u0000') >= 0) return notFound();
        String name = path.startsWith("/") ? path.substring(1) : path;
        try {
            InputStream input;
            File content = activeContentDirectory;
            if (content != null) {
                File target = new File(content, name);
                if (!target.isFile() || !target.getCanonicalPath().startsWith(content.getCanonicalPath() + File.separator))
                    return notFound();
                input = new FileInputStream(target);
            } else {
                input = getAssets().open("site/" + name);
            }
            String mime = mimeFor(name);
            WebResourceResponse response = new WebResourceResponse(mime, isText(mime) ? "UTF-8" : null, input);
            response.setStatusCodeAndReasonPhrase(200, "OK");
            response.setResponseHeaders(Collections.singletonMap("Access-Control-Allow-Origin", "https://" + HOST));
            return response;
        } catch (Exception ignored) { return notFound(); }
    }
    private static WebResourceResponse notFound() {
        WebResourceResponse response = new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream("Arquivo não encontrado".getBytes(StandardCharsets.UTF_8)));
        response.setStatusCodeAndReasonPhrase(404, "Not Found");
        return response;
    }
    private static boolean isText(String mime) {
        return mime.startsWith("text/") || mime.equals("application/javascript") || mime.equals("application/json");
    }
    private static String mimeFor(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        if (n.endsWith(".html")) return "text/html";
        if (n.endsWith(".js")) return "application/javascript";
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".json") || n.endsWith(".webmanifest")) return "application/json";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".gif")) return "image/gif";
        if (n.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private void checkForUpdates(boolean manuallyRequested) {
        if (updateBusy) {
            if (manuallyRequested) toast("Já existe uma verificação em andamento.");
            return;
        }
        updateBusy = true;
        new Thread(() -> {
            try {
                JSONObject json = new JSONObject(new String(fetchSmall(MANIFEST_URL, 16384), StandardCharsets.UTF_8));
                UpdateInfo info = new UpdateInfo();
                info.version = json.getString("version");
                info.url = json.getString("url");
                info.sha256 = json.getString("sha256").toLowerCase(Locale.ROOT);
                info.minimumAndroidVersion = json.optInt("minAndroidVersion", 1);
                if (!isVersion(info.version) || !info.sha256.matches("[0-9a-f]{64}") || !isTrustedUrl(info.url))
                    throw new IOException("Manifesto de atualização inválido");
                if (info.minimumAndroidVersion > BuildVersion.CODE) {
                    if (manuallyRequested) toast("Uma nova versão do APK é necessária para esta atualização.");
                    return;
                }
                if (compareVersion(info.version, getCurrentWebVersion()) <= 0) {
                    if (manuallyRequested) toast("O jogo já está atualizado: v" + getCurrentWebVersion());
                    return;
                }
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    new AlertDialog.Builder(this)
                        .setTitle("Nova versão do Blue Lock NEO")
                        .setMessage("Atualização v" + info.version + " disponível. Sua liga e seus retratos permanecem salvos. Deseja baixar agora?")
                        .setNegativeButton("Agora não", (dialog, which) -> {})
                        .setPositiveButton("Atualizar", (dialog, which) -> installUpdate(info))
                        .show();
                });
            } catch (Exception e) {
                if (manuallyRequested) toast("Não foi possível verificar. Confira a internet e a publicação do site.");
            } finally { updateBusy = false; }
        }, "BlueLockUpdateCheck").start();
    }

    /** Pinned host, https only, no cross-domain redirects. */
    private static boolean isTrustedUrl(String value) {
        try {
            URL url = new URL(value);
            return "https".equals(url.getProtocol()) && UPDATE_HOST.equals(url.getHost()) && url.getPort() == -1 && url.getPath().startsWith("/Blue-lock-neo/updates/");
        } catch (Exception ignored) { return false; }
    }
    private static HttpURLConnection connectTrusted(String urlText) throws IOException {
        if (!isTrustedUrl(urlText)) throw new IOException("Servidor não autorizado");
        HttpURLConnection connection = (HttpURLConnection) new URL(urlText).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(15000);
        connection.setRequestProperty("Cache-Control", "no-cache");
        int code = connection.getResponseCode();
        if (code != 200) { connection.disconnect(); throw new IOException("HTTP " + code); }
        return connection;
    }
    private static byte[] fetchSmall(String urlText, int limit) throws IOException {
        HttpURLConnection connection = connectTrusted(urlText);
        try (InputStream input = connection.getInputStream(); java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096]; int n;
            while ((n = input.read(buffer)) >= 0) {
                if (output.size() + n > limit) throw new IOException("Arquivo de configuração grande demais");
                output.write(buffer, 0, n);
            }
            return output.toByteArray();
        } finally { connection.disconnect(); }
    }

    private static final class BuildVersion { static final int CODE = 96; }

    private void installUpdate(UpdateInfo info) {
        if (updateBusy) return;
        updateBusy = true;
        toast("Baixando atualização v" + info.version + "…");
        new Thread(() -> {
            File temporaryZip = null;
            File staging = null;
            try {
                File base = new File(getFilesDir(), "web-updates");
                if (!base.exists() && !base.mkdirs()) throw new IOException("Sem espaço para atualização");
                temporaryZip = new File(getCacheDir(), "blue-lock-update-" + UUID.randomUUID() + ".zip");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                HttpURLConnection connection = connectTrusted(info.url);
                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(temporaryZip)) {
                    byte[] buffer = new byte[16384]; long count = 0; int n;
                    while ((n = input.read(buffer)) >= 0) {
                        count += n;
                        if (count > MAX_PACKAGE_BYTES) throw new IOException("Pacote excedeu o tamanho máximo");
                        digest.update(buffer, 0, n);
                        output.write(buffer, 0, n);
                    }
                } finally { connection.disconnect(); }
                if (!hex(digest.digest()).equals(info.sha256)) throw new IOException("Assinatura de integridade incorreta");
                staging = new File(base, ".staging-" + UUID.randomUUID());
                if (!staging.mkdir()) throw new IOException("Falha ao preparar conteúdo");
                unpack(temporaryZip, staging);
                if (!new File(staging, "index.html").isFile() || !new File(staging, "app.js").isFile() || !new File(staging, "engine.js").isFile())
                    throw new IOException("Conteúdo incompleto");
                File destination = new File(base, info.version);
                if (!destination.exists() && !staging.renameTo(destination)) throw new IOException("Não foi possível ativar atualização");
                if (destination.isDirectory()) {
                    preferences().edit().putString(PREF_WEB_VERSION, info.version).apply();
                    activeContentDirectory = destination;
                    File finalZip = temporaryZip;
                    runOnUiThread(() -> {
                        if (webView != null) {
                            webView.clearCache(true);
                            webView.loadUrl(HOME + "?web=" + info.version);
                        }
                        toast("Jogo atualizado para v" + info.version + "!");
                    });
                }
            } catch (Exception e) {
                toast("Atualização cancelada: " + e.getMessage() + ". Sua versão antiga continua disponível.");
            } finally {
                if (temporaryZip != null) temporaryZip.delete();
                if (staging != null && staging.exists()) deleteRecursive(staging);
                updateBusy = false;
            }
        }, "BlueLockUpdateInstall").start();
    }

    private static String hex(byte[] bytes) {
        char[] chars = "0123456789abcdef".toCharArray();
        char[] result = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) { result[2 * i] = chars[(bytes[i] >> 4) & 15]; result[2 * i + 1] = chars[bytes[i] & 15]; }
        return new String(result);
    }
    private static void unpack(File archive, File folder) throws IOException {
        long total = 0; int files = 0;
        String root = folder.getCanonicalPath() + File.separator;
        try (ZipInputStream zip = new ZipInputStream(new FileInputStream(archive))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.isEmpty() || name.startsWith("/") || name.contains("\\") || name.indexOf('\u0000') >= 0) throw new IOException("Caminho inválido no pacote");
                File output = new File(folder, name);
                if (!output.getCanonicalPath().startsWith(root)) throw new IOException("Caminho fora da pasta do aplicativo");
                if (entry.isDirectory()) {
                    if (!output.isDirectory() && !output.mkdirs()) throw new IOException("Diretório inválido");
                } else {
                    if (++files > MAX_FILES) throw new IOException("Muitos arquivos na atualização");
                    File parent = output.getParentFile();
                    if (parent != null && !parent.isDirectory() && !parent.mkdirs()) throw new IOException("Diretório inválido");
                    try (FileOutputStream stream = new FileOutputStream(output)) {
                        byte[] buffer = new byte[16384]; int n;
                        while ((n = zip.read(buffer)) >= 0) {
                            total += n;
                            if (total > MAX_UNPACKED_BYTES) throw new IOException("Atualização grande demais");
                            stream.write(buffer, 0, n);
                        }
                    }
                }
                zip.closeEntry();
            }
        }
    }
    private static void deleteRecursive(File file) {
        if (file.isDirectory()) { File[] children = file.listFiles(); if (children != null) for (File child : children) deleteRecursive(child); }
        file.delete();
    }

    private void resetWebUpdate() {
        runOnUiThread(() -> new AlertDialog.Builder(this)
            .setTitle("Restaurar jogo original")
            .setMessage("Voltar ao jogo incluído no APK? Sua liga e seus retratos não serão apagados.")
            .setNegativeButton("Cancelar", (d, w) -> {})
            .setPositiveButton("Restaurar", (d, w) -> {
                preferences().edit().remove(PREF_WEB_VERSION).apply();
                activeContentDirectory = null;
                if (webView != null) { webView.clearCache(true); webView.loadUrl(HOME + "?original=1"); }
            }).show());
    }
    private void openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"http".equals(scheme)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception ignored) { toast("Não há navegador para este link"); }
    }
    private void toast(String message) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
    }

    private final class AndroidBridge {
        @JavascriptInterface public String getInstalledVersion() { return getCurrentWebVersion(); }
        @JavascriptInterface public void checkForUpdates() { MainActivity.this.checkForUpdates(true); }
        @JavascriptInterface public void restoreBundledVersion() { resetWebUpdate(); }
        @JavascriptInterface public void saveJson(String suggestedName, String content) {
            if (content == null || content.length() > 32 * 1024 * 1024) return;
            final String safeName = suggestedName == null ? "blue-lock-backup.json" : suggestedName.replaceAll("[^A-Za-z0-9_.-]", "_");
            final byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            runOnUiThread(() -> {
                pendingExport = bytes;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.setType("application/json");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.putExtra(Intent.EXTRA_TITLE, safeName);
                try { startActivityForResult(intent, REQUEST_EXPORT); }
                catch (Exception e) { pendingExport = null; toast("Não foi possível exportar backup"); }
            });
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_PICK) {
            if (fileCallback != null) {
                fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                fileCallback = null;
            }
        } else if (requestCode == REQUEST_EXPORT) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingExport != null) {
                try (OutputStream stream = getContentResolver().openOutputStream(data.getData())) {
                    if (stream == null) throw new IOException("Sem saída de arquivo");
                    stream.write(pendingExport);
                    toast("Backup salvo!");
                } catch (Exception e) { toast("Falha ao salvar backup"); }
            }
            pendingExport = null;
        }
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
