package com.beforecut.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * MainActivity - Handles Android permissions and WebView camera access
 *
 * Flow:
 * 1. App starts -> onCreate() checks and requests CAMERA permission
 * 2. User grants/denies permission -> onRequestPermissionsResult() handles result
 * 3. WebView requests camera -> Custom WebChromeClient grants if Android permission exists
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 1001;

    // Permissions needed for camera functionality
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate: App starting");

        // Check and request permissions on app start
        checkAndRequestPermissions();
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume: Setting up WebChromeClient for camera permissions");

        // Set up WebChromeClient to handle WebView permission requests
        setupWebViewCameraPermissions();
    }

    /**
     * Check if all required permissions are granted
     */
    private boolean hasAllPermissions() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check permissions and request if not granted
     */
    private void checkAndRequestPermissions() {
        if (hasAllPermissions()) {
            Log.d(TAG, "All permissions already granted");
            return;
        }

        // Collect permissions that need to be requested
        List<String> permissionsToRequest = new ArrayList<>();
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission)
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
                Log.d(TAG, "Permission needed: " + permission);
            }
        }

        if (!permissionsToRequest.isEmpty()) {
            Log.d(TAG, "Requesting " + permissionsToRequest.size() + " permissions");
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toArray(new String[0]),
                PERMISSION_REQUEST_CODE
            );
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                          @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE) {
            for (int i = 0; i < permissions.length; i++) {
                String permission = permissions[i];
                boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                Log.d(TAG, "Permission " + permission + ": " + (granted ? "GRANTED" : "DENIED"));
            }

            // Re-setup WebView permissions after Android permission result
            setupWebViewCameraPermissions();
        }
    }

    /**
     * Set up custom WebChromeClient to handle WebView permission requests
     * This allows the WebView to access the camera when getUserMedia() is called
     */
    private void setupWebViewCameraPermissions() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) {
                Log.w(TAG, "WebView is null, cannot setup camera permissions");
                return;
            }

            // Get the existing WebChromeClient from Capacitor's bridge
            final WebChromeClient existingClient = webView.getWebChromeClient();

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    Log.d(TAG, "WebView permission request received");

                    // Log requested resources
                    String[] resources = request.getResources();
                    for (String resource : resources) {
                        Log.d(TAG, "Requested resource: " + resource);
                    }

                    // Check if we have Android camera permission
                    boolean hasCameraPermission = ContextCompat.checkSelfPermission(
                        MainActivity.this,
                        Manifest.permission.CAMERA
                    ) == PackageManager.PERMISSION_GRANTED;

                    if (hasCameraPermission) {
                        Log.d(TAG, "Granting WebView camera permission");
                        // Run on UI thread to avoid threading issues
                        runOnUiThread(() -> {
                            request.grant(request.getResources());
                        });
                    } else {
                        Log.w(TAG, "Cannot grant WebView permission - Android permission not granted");
                        // Request Android permission first
                        checkAndRequestPermissions();
                        // Deny the WebView request for now - it will retry after permission is granted
                        runOnUiThread(() -> {
                            request.deny();
                        });
                    }
                }

                @Override
                public void onPermissionRequestCanceled(PermissionRequest request) {
                    Log.d(TAG, "WebView permission request canceled");
                    super.onPermissionRequestCanceled(request);
                }

                // Delegate other methods to existing client if available
                @Override
                public void onProgressChanged(WebView view, int newProgress) {
                    if (existingClient != null) {
                        existingClient.onProgressChanged(view, newProgress);
                    } else {
                        super.onProgressChanged(view, newProgress);
                    }
                }

                @Override
                public void onReceivedTitle(WebView view, String title) {
                    if (existingClient != null) {
                        existingClient.onReceivedTitle(view, title);
                    } else {
                        super.onReceivedTitle(view, title);
                    }
                }
            });

            Log.d(TAG, "WebChromeClient setup complete");
        } catch (Exception e) {
            Log.e(TAG, "Error setting up WebView camera permissions", e);
        }
    }
}
