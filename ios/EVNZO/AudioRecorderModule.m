#import "AudioRecorderModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioRecorderModule {
    AVAudioRecorder *_audioRecorder;
    NSString *_audioFilePath;
    NSTimer *_meteringTimer;
    BOOL _hasListeners;
}

RCT_EXPORT_MODULE();

// Required for event emitter
- (NSArray<NSString *> *)supportedEvents {
    return @[@"audioLevel"];
}

// Track whether we have listeners
- (void)startObserving {
    _hasListeners = YES;
}

- (void)stopObserving {
    _hasListeners = NO;
}

RCT_EXPORT_METHOD(checkPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    AVAudioSessionRecordPermission permission = [[AVAudioSession sharedInstance] recordPermission];

    NSString *status;
    switch (permission) {
        case AVAudioSessionRecordPermissionGranted:
            status = @"granted";
            break;
        case AVAudioSessionRecordPermissionDenied:
            status = @"denied";
            break;
        case AVAudioSessionRecordPermissionUndetermined:
            status = @"undetermined";
            break;
        default:
            status = @"undetermined";
            break;
    }

    resolve(@{@"status": status});
}

RCT_EXPORT_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSLog(@"🎤 [AudioRecorder] startRecording called");

    // Request microphone permission first (iOS 14+)
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
        NSLog(@"🎤 [AudioRecorder] Permission callback received, granted: %d", granted);

        dispatch_async(dispatch_get_main_queue(), ^{
            if (!granted) {
                NSLog(@"❌ [AudioRecorder] Permission denied");
                reject(@"permission_denied", @"Microphone permission was denied. Please enable it in Settings.", nil);
                return;
            }

            NSLog(@"✅ [AudioRecorder] Permission granted, setting up audio session...");

            // Set up audio session
            AVAudioSession *audioSession = [AVAudioSession sharedInstance];
            NSError *sessionError = nil;
            [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
                          withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
                                error:&sessionError];

            if (sessionError) {
                NSLog(@"❌ [AudioRecorder] Failed to set category: %@", sessionError.localizedDescription);
                reject(@"audio_session_error", [NSString stringWithFormat:@"Failed to setup audio session: %@", sessionError.localizedDescription], sessionError);
                return;
            }

            NSLog(@"✅ [AudioRecorder] Audio category set");

            [audioSession setActive:YES error:&sessionError];

            if (sessionError) {
                NSLog(@"❌ [AudioRecorder] Failed to activate session: %@", sessionError.localizedDescription);
                reject(@"audio_session_error", [NSString stringWithFormat:@"Failed to activate audio session: %@", sessionError.localizedDescription], sessionError);
                return;
            }

            NSLog(@"✅ [AudioRecorder] Audio session activated");

            // Create file path
            NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
            NSString *documentsDirectory = [paths objectAtIndex:0];
            self->_audioFilePath = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"recording_%@.m4a", [[NSUUID UUID] UUIDString]]];
            NSURL *audioFileURL = [NSURL fileURLWithPath:self->_audioFilePath];

            NSLog(@"📁 [AudioRecorder] File path: %@", self->_audioFilePath);

            // Set up recording settings
            // Using AAC format which is widely compatible with iOS playback
            NSDictionary *recordSettings = @{
                AVFormatIDKey: @(kAudioFormatMPEG4AAC),
                AVSampleRateKey: @(44100.0),
                AVNumberOfChannelsKey: @(1),
                AVEncoderAudioQualityKey: @(AVAudioQualityMedium),
                AVEncoderBitRateKey: @(64000)  // 64 kbps for voice is sufficient
            };

            NSLog(@"⚙️ [AudioRecorder] Creating recorder with settings: %@", recordSettings);

            // Create recorder
            NSError *recorderError = nil;
            self->_audioRecorder = [[AVAudioRecorder alloc] initWithURL:audioFileURL settings:recordSettings error:&recorderError];

            if (recorderError || !self->_audioRecorder) {
                NSString *errorMessage = recorderError ? recorderError.localizedDescription : @"Unknown error";
                NSLog(@"❌ [AudioRecorder] Failed to create recorder: %@", errorMessage);
                reject(@"recorder_init_error", [NSString stringWithFormat:@"Failed to initialize recorder: %@", errorMessage], recorderError);
                return;
            }

            NSLog(@"✅ [AudioRecorder] Recorder created successfully");

            // Enable metering for audio level monitoring
            self->_audioRecorder.meteringEnabled = YES;

            // Start recording
            [self->_audioRecorder prepareToRecord];
            NSLog(@"🎙️ [AudioRecorder] Prepared to record, now starting...");

            BOOL success = [self->_audioRecorder record];

            NSLog(@"🎙️ [AudioRecorder] Record method returned: %d", success);

            if (success) {
                NSLog(@"✅ [AudioRecorder] Recording started successfully!");

                // Start metering timer to send audio levels to React Native
                self->_meteringTimer = [NSTimer scheduledTimerWithTimeInterval:0.05 // 50ms = 20 updates per second
                                                                        target:self
                                                                      selector:@selector(updateMeters)
                                                                      userInfo:nil
                                                                       repeats:YES];

                resolve(@{@"success": @YES});
            } else {
                NSLog(@"❌ [AudioRecorder] Failed to start recording");
                reject(@"recording_start_error", @"Failed to start recording - check microphone availability", nil);
            }
        });
    }];
}

// Update and send audio level to React Native
- (void)updateMeters {
    if (_audioRecorder && _audioRecorder.isRecording) {
        [_audioRecorder updateMeters];

        // Get peak power for channel 0 (ranges from -160 dB to 0 dB)
        // Using peakPower instead of averagePower for more responsive visualization
        float peakPower = [_audioRecorder peakPowerForChannel:0];

        // More sensitive normalization for better visualization
        // Focus on the -50 dB to 0 dB range which is typical for speech
        // Anything below -50 dB is considered silence
        float minDB = -50.0;
        float maxDB = 0.0;

        // Clamp to our range
        float clampedDB = MAX(minDB, MIN(maxDB, peakPower));

        // Normalize to 0.0 - 1.0
        float normalizedLevel = (clampedDB - minDB) / (maxDB - minDB);

        // Apply power curve to make quieter sounds more visible
        // This makes the waveform more dramatic and easier to see
        normalizedLevel = powf(normalizedLevel, 0.5); // Square root for sensitivity boost

        // Send event to React Native if we have listeners
        if (_hasListeners) {
            [self sendEventWithName:@"audioLevel" body:@{@"level": @(normalizedLevel)}];
        }
    }
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Stop metering timer
    if (_meteringTimer) {
        [_meteringTimer invalidate];
        _meteringTimer = nil;
    }

    if (_audioRecorder && _audioRecorder.isRecording) {
        [_audioRecorder stop];

        // Reset the session category to Playback BEFORE deactivating so
        // anything that activates the session next (e.g. react-native-sound
        // playing a voice note back) finds it in a playback-compatible
        // state. Leaving it on PlayAndRecord causes Sound.play() to fail
        // with OSStatus -10875 (kAudioSessionIncompatibleCategory).
        AVAudioSession *session = [AVAudioSession sharedInstance];
        NSError *error = nil;
        [session setCategory:AVAudioSessionCategoryPlayback error:&error];
        if (error) {
            NSLog(@"⚠️ [AudioRecorder] Failed to reset category: %@", error.localizedDescription);
            error = nil;
        }

        // NotifyOthersOnDeactivation lets other audio apps know they can
        // resume — recommended by Apple whenever you deactivate.
        [session setActive:NO
              withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                    error:&error];
        if (error) {
            NSLog(@"⚠️ [AudioRecorder] Failed to deactivate session: %@", error.localizedDescription);
        }

        resolve(@{
            @"success": @YES,
            @"path": _audioFilePath ?: @"",
            @"duration": @(_audioRecorder.currentTime)
        });

        _audioRecorder = nil;
    } else {
        reject(@"not_recording", @"No active recording", nil);
    }
}

RCT_EXPORT_METHOD(cancelRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Stop metering timer
    if (_meteringTimer) {
        [_meteringTimer invalidate];
        _meteringTimer = nil;
    }

    if (_audioRecorder && _audioRecorder.isRecording) {
        [_audioRecorder stop];
        [_audioRecorder deleteRecording];

        // Same fix as stopRecording — reset category to Playback before
        // deactivating so the next playback isn't blocked by -10875.
        AVAudioSession *session = [AVAudioSession sharedInstance];
        NSError *error = nil;
        [session setCategory:AVAudioSessionCategoryPlayback error:&error];
        if (error) error = nil;
        [session setActive:NO
              withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                    error:&error];

        _audioRecorder = nil;
        _audioFilePath = nil;

        resolve(@{@"success": @YES});
    } else {
        reject(@"not_recording", @"No active recording", nil);
    }
}

@end
