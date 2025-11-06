#import "AudioRecorderModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioRecorderModule {
    AVAudioRecorder *_audioRecorder;
    NSString *_audioFilePath;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // Set up audio session
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *sessionError = nil;
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:&sessionError];
    [audioSession setActive:YES error:&sessionError];

    if (sessionError) {
        reject(@"audio_session_error", @"Failed to setup audio session", sessionError);
        return;
    }

    // Create file path
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths objectAtIndex:0];
    _audioFilePath = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"recording_%@.m4a", [[NSUUID UUID] UUIDString]]];
    NSURL *audioFileURL = [NSURL fileURLWithPath:_audioFilePath];

    // Set up recording settings
    // Using AAC format which is widely compatible with iOS playback
    NSDictionary *recordSettings = @{
        AVFormatIDKey: @(kAudioFormatMPEG4AAC),
        AVSampleRateKey: @(44100.0),
        AVNumberOfChannelsKey: @(1),
        AVEncoderAudioQualityKey: @(AVAudioQualityMedium),
        AVEncoderBitRateKey: @(64000)  // 64 kbps for voice is sufficient
    };

    // Create recorder
    NSError *recorderError = nil;
    _audioRecorder = [[AVAudioRecorder alloc] initWithURL:audioFileURL settings:recordSettings error:&recorderError];

    if (recorderError || !_audioRecorder) {
        reject(@"recorder_init_error", @"Failed to initialize recorder", recorderError);
        return;
    }

    // Start recording
    [_audioRecorder prepareToRecord];
    BOOL success = [_audioRecorder record];

    if (success) {
        resolve(@{@"success": @YES});
    } else {
        reject(@"recording_start_error", @"Failed to start recording", nil);
    }
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
