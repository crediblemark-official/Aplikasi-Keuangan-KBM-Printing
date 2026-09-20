package com.kbm.operasional;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDeviceLockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
