package vn.cococord.config;

import org.apache.catalina.Context;
import org.apache.catalina.Lifecycle;
import org.apache.catalina.LifecycleEvent;
import org.apache.catalina.LifecycleListener;
import org.apache.catalina.WebResourceRoot;
import org.springframework.util.ResourceUtils;
import java.io.File;
import java.net.URI;
import java.net.URL;

public class JSPStaticResourceConfigurer implements LifecycleListener {
    private final Context context;
    private final String subPath = "/META-INF";

    public JSPStaticResourceConfigurer(Context context) {
        this.context = context;
    }

    @Override
    public void lifecycleEvent(LifecycleEvent event) {
        if (!event.getType().equals(Lifecycle.CONFIGURE_START_EVENT)) {
            return;
        }
        URL finalLocation = getUrl();
        if (finalLocation == null) {
            return;
        }

        // Check if the directory exists before adding it
        try {
            if (ResourceUtils.isFileURL(finalLocation)) {
                File metaInfDir = new File(finalLocation.toURI().getPath() + subPath);
                if (!metaInfDir.exists()) {
                    // Create the directory if it doesn't exist
                    metaInfDir.mkdirs();
                }
            }
        } catch (Exception e) {
            // Ignore and try to add the resource anyway
        }

        this.context.getResources().createWebResourceSet(
                WebResourceRoot.ResourceSetType.RESOURCE_JAR,
                "/",
                finalLocation,
                subPath);
    }

    private URL getUrl() {
        URL location = this.getClass().getProtectionDomain().getCodeSource().getLocation();
        if (ResourceUtils.isFileURL(location)) {
            return location;
        } else if (ResourceUtils.isJarURL(location)) {
            try {
                String locationStr = location.getPath()
                        .replaceFirst("^nested:", "")
                        .replaceFirst("/!BOOT-INF/classes/!/", "!/");
                return new URI("jar:file", locationStr, null).toURL();
            } catch (Exception e) {
                throw new IllegalStateException("Unable to add new JSP source URI to tomcat resources", e);
            }
        } else {
            throw new IllegalStateException("Can not add tomcat resources, unhandleable url: " + location);
        }
    }
}
