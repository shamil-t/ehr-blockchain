use std::sync::{mpsc::channel, Arc};

use edr_napi_core::logger::LoggerError;
use edr_primitives::Bytes;
use napi::{
    threadsafe_function::{
        ErrorStrategy, ThreadSafeCallContext, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    },
    JsFunction, Status,
};
use napi_derive::napi;

#[napi(object)]
pub struct LoggerConfig {
    /// Whether to enable the logger.
    pub enable: bool,
    #[napi(ts_type = "(inputs: ArrayBuffer[]) => string[]")]
    pub decode_console_log_inputs_callback: JsFunction,
    #[napi(ts_type = "(message: string, replace: boolean) => void")]
    pub print_line_callback: JsFunction,
}

impl LoggerConfig {
    /// Resolves the logger config, converting it to a
    /// `edr_napi_core::logger::Config`.
    pub fn resolve(self, env: &napi::Env) -> napi::Result<edr_napi_core::logger::Config> {
        let mut decode_console_log_inputs_callback: ThreadsafeFunction<_, ErrorStrategy::Fatal> =
            self.decode_console_log_inputs_callback
                .create_threadsafe_function(0, |ctx: ThreadSafeCallContext<Vec<Bytes>>| {
                    let inputs = ctx.env.create_array_with_length(ctx.value.len()).and_then(
                        |mut inputs| {
                            for (idx, input) in ctx.value.into_iter().enumerate() {
                                ctx.env
                                    .create_arraybuffer_with_data(input.to_vec())
                                    .and_then(|input| {
                                        inputs.set_element(idx as u32, input.into_raw())
                                    })?;
                            }

                            Ok(inputs)
                        },
                    )?;

                    Ok(vec![inputs])
                })?;

        // Maintain a weak reference to the function to avoid blocking the event loop
        // from exiting.
        decode_console_log_inputs_callback.unref(env)?;

        let decode_console_log_inputs_fn = Arc::new(move |console_log_inputs| {
            let (sender, receiver) = channel();

            let status = decode_console_log_inputs_callback.call_with_return_value(
                console_log_inputs,
                ThreadsafeFunctionCallMode::Blocking,
                move |decoded_inputs: Vec<String>| {
                    sender.send(decoded_inputs).map_err(|_error| {
                        napi::Error::new(
                            Status::GenericFailure,
                            "Failed to send result from decode_console_log_inputs",
                        )
                    })
                },
            );
            assert_eq!(status, Status::Ok);

            receiver
                .recv()
                .expect("Receive can only fail if the channel is closed")
        });

        let mut print_line_callback: ThreadsafeFunction<_, ErrorStrategy::Fatal> = self
            .print_line_callback
            .create_threadsafe_function(0, |ctx: ThreadSafeCallContext<(String, bool)>| {
                // String
                let message = ctx.env.create_string_from_std(ctx.value.0)?;

                // bool
                let replace = ctx.env.get_boolean(ctx.value.1)?;

                Ok(vec![message.into_unknown(), replace.into_unknown()])
            })?;

        // Maintain a weak reference to the function to avoid blocking the event loop
        // from exiting.
        print_line_callback.unref(env)?;

        let print_line_fn = Arc::new(move |message, replace| {
            let (sender, receiver) = channel();

            let status = print_line_callback.call_with_return_value(
                (message, replace),
                ThreadsafeFunctionCallMode::Blocking,
                move |()| {
                    sender.send(()).map_err(|_error| {
                        napi::Error::new(
                            Status::GenericFailure,
                            "Failed to send result from decode_console_log_inputs",
                        )
                    })
                },
            );

            let () = receiver.recv().unwrap();

            if status == napi::Status::Ok {
                Ok(())
            } else {
                Err(LoggerError::PrintLine)
            }
        });

        Ok(edr_napi_core::logger::Config {
            enable: self.enable,
            decode_console_log_inputs_fn,
            print_line_fn,
        })
    }
}
