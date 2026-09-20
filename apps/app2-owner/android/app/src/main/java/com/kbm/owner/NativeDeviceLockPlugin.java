package com.kbm.owner;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeDeviceLock")
public class NativeDeviceLockPlugin extends Plugin {

    @PluginMethod
    public void isDeviceSecure(PluginCall call) {
        try {
            KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
            boolean isSecure = km != null && km.isDeviceSecure();
            JSObject ret = new JSObject();
            ret.put("isSecure", isSecure);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("isSecure", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        try {
            KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
            if (km == null || !km.isDeviceSecure()) {
                // Perangkat tidak dipasangi kunci layar (PIN/Pola/Biometrik)
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("isSecure", false);
                ret.put("notEnrolled", true);
                call.resolve(ret);
                return;
            }

            String title = call.getString("title", "KBM Owner");
            String description = call.getString("description", "Gunakan PIN, Pola, atau Sidik Jari untuk membuka aplikasi");

            Intent intent = km.createConfirmDeviceCredentialIntent(title, description);
            if (intent == null) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("isSecure", false);
                call.resolve(ret);
                return;
            }

            startActivityForResult(call, intent, "deviceCredentialResult");
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("error", "Gagal membuka kunci layar: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @ActivityCallback
    private void deviceCredentialResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("isSecure", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("isSecure", true);
            ret.put("error", "Verifikasi kunci layar dibatalkan");
            call.resolve(ret);
        }
    }
}
