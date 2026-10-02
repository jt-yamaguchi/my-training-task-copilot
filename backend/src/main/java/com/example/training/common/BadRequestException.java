package com.example.training.common;

/**
 * リクエストの指定が不正な場合に送出する。
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
