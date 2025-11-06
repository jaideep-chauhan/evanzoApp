#import "AudioRecorderModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioRecorderModule {
    AVAudioRecorder *_audioRecorder;
    NSString *_audioFilePath;
}

RCT_EXPORT_MODULE();

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

            // Start recording
            [self->_audioRecorder prepareToRecord];
            NSLog(@"🎙️ [AudioRecorder] Prepared to record, now starting...");

            BOOL success = [self->_audioRecorder record];

            NSLog(@"🎙️ [AudioRecorder] Record method returned: %d", success);

            if (success) {
                NSLog(@"✅ [AudioRecorder] Recording started successfully!");
                resolve(@{@"success": @YES});
            } else {
                NSLog(@"❌ [AudioRecorder] Failed to start recording");
                reject(@"recording_start_error", @"Failed to start recording - check microphone availability", nil);
            }
        });
    }];
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (_audioRecorder && _audioRecorder.isRecording) {
        [_audioRecorder stop];

        // Deactivate audio session
        NSError *error = nil;
        [[AVAudioSession sharedInstance] setActive:NO error:&error];

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
    if (_audioRecorder && _audioRecorder.isRecording) {
        [_audioRecorder stop];
        [_audioRecorder deleteRecording];

        NSError *error = nil;
        [[AVAudioSession sharedInstance] setActive:NO error:&error];

        _audioRecorder = nil;
        _audioFilePath = nil;

        resolve(@{@"success": @YES});
    } else {
        reject(@"not_recording", @"No active recording", nil);
    }
}

@end
